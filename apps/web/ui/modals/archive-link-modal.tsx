import { BlurImage } from "@/ui/shared/blur-image";
import { Button, Modal } from "@dub/ui";
import {
  GOOGLE_FAVICON_URL,
  getApexDomain,
  getQueryString,
  linkConstructor,
} from "@dub/utils";
import { type Link as LinkProps } from "@prisma/client";
import { useParams, useSearchParams } from "next/navigation";
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";
import { mutate } from "swr";

function ArchiveLinkModal({
  showArchiveLinkModal,
  setShowArchiveLinkModal,
  props,
  archived,
}: {
  showArchiveLinkModal: boolean;
  setShowArchiveLinkModal: Dispatch<SetStateAction<boolean>>;
  props: LinkProps;
  archived: boolean;
}) {
  const params = useParams() as { slug?: string };
  const { slug } = params;
  const searchParams = useSearchParams();
  const [archiving, setArchiving] = useState(false);
  const apexDomain = getApexDomain(props.url);

  const { key, domain } = props;

  const shortlink = useMemo(() => {
    return linkConstructor({
      key,
      domain,
      pretty: true,
    });
  }, [key, domain]);

  return (
    <Modal
      showModal={showArchiveLinkModal}
      setShowModal={setShowArchiveLinkModal}
    >
      <div className="flex flex-col items-center justify-center space-y-3 border-b border-gray-200 px-4 py-4 pt-8 text-center sm:px-16">
        <BlurImage
          src={`${GOOGLE_FAVICON_URL}${apexDomain}`}
          alt={apexDomain}
          className="h-10 w-10 rounded-full"
          width={20}
          height={20}
        />
        <h3 className="text-lg font-medium">
          {archived ? "Archive" : "Unarchive"} {shortlink}
        </h3>
        <p className="text-sm text-gray-500">
          {archived
            ? "Archived links will still work - they just won't show up on your main dashboard."
            : "By unarchiving this link, it will show up on your main dashboard again."}
        </p>
      </div>

      <div className="flex flex-col space-y-6 bg-gray-50 px-4 py-8 text-left sm:px-16">
        <Button
          onClick={async (e) => {
            e.preventDefault();
            setArchiving(true);
            fetch(
              `/api${slug ? `/projects/${slug}/links` : "/links-app"}/${
                props.id
              }/archive`,
              {
                method: archived ? "POST" : "DELETE",
                headers: {
                  "Content-Type": "application/json",
                },
              },
            ).then(async (res) => {
              if (res.status === 200) {
                await Promise.all([
                  mutate(
                    (key) =>
                      typeof key === "string" &&
                      key.startsWith(
                        `/api${
                          slug ? `/projects/${slug}/links` : "/links-app"
                        }`,
                      ),
                  ),
                  mutate(
                    (key) =>
                      typeof key === "string" &&
                      key.startsWith(
                        `/api${slug ? `/projects/${slug}` : ""}/links/count`,
                      ),
                    undefined,
                    { revalidate: true },
                  ),
                ]);
                setShowArchiveLinkModal(false);
                toast.success(
                  `Successfully ${archived ? "archived" : "unarchived"} link!`,
                );
              } else {
                toast.error(res.statusText);
              }
              setArchiving(false);
            });
          }}
          autoFocus
          loading={archiving}
          text={`Confirm ${archived ? "archive" : "unarchive"}`}
        />
      </div>
    </Modal>
  );
}

export function useArchiveLinkModal({
  props,
  archived = true,
}: {
  props: LinkProps;
  archived: boolean;
}) {
  const [showArchiveLinkModal, setShowArchiveLinkModal] = useState(false);

  const ArchiveLinkModalCallback = useCallback(() => {
    return props ? (
      <ArchiveLinkModal
        showArchiveLinkModal={showArchiveLinkModal}
        setShowArchiveLinkModal={setShowArchiveLinkModal}
        props={props}
        archived={archived}
      />
    ) : null;
  }, [showArchiveLinkModal, setShowArchiveLinkModal]);

  return useMemo(
    () => ({
      setShowArchiveLinkModal,
      ArchiveLinkModal: ArchiveLinkModalCallback,
    }),
    [setShowArchiveLinkModal, ArchiveLinkModalCallback],
  );
}
